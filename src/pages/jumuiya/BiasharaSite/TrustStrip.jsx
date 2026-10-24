import React from "react";
import { Clock3, MapPin, MessageCircle, PackageCheck } from "lucide-react";
import { readableBrandText, Reveal } from "./utils.jsx";

function TrustItem({ icon: Icon, label, value, primary }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-3 sm:px-5 sm:py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: primary + "10", color: readableBrandText(primary) }}>
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400">{label}</span>
        <span className="mt-1 block break-words text-xs font-bold text-slate-800 sm:text-sm">{value}</span>
      </span>
    </div>
  );
}

export default function TrustStrip({
  business = {},
  openingStatus,
  whatsappEnabled = false,
  productCount = 0,
  showProducts = true,
  primary = "#1d4ed8",
}) {
  const location = [business.location, business.county].filter((part) => String(part || "").trim()).join(", ");
  const status = openingStatus?.isOpen === true
    ? "Open now"
    : openingStatus?.isOpen === false
      ? "Closed now"
      : "Hours not listed";
  const items = [];
  if (location) items.push({ icon: MapPin, label: "Location", value: location });
  items.push({ icon: Clock3, label: "Business hours", value: status });
  if (whatsappEnabled) items.push({ icon: MessageCircle, label: "Direct contact", value: "WhatsApp available" });
  if (showProducts) items.push({ icon: PackageCheck, label: "Catalogue", value: productCount + (productCount === 1 ? " listed item" : " listed items") });

  return (
    <div className="relative z-10 border-b border-slate-200/80 bg-white">
      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-6 lg:px-8">
        <Reveal className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0" delay={60}>
          {items.map((item) => <TrustItem key={item.label} {...item} primary={primary} />)}
        </Reveal>
      </div>
    </div>
  );
}
