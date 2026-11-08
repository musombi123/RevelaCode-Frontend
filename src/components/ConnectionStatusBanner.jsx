import React, { useEffect, useState } from "react";
import { WifiOff, SignalLow } from "lucide-react";

function readInitialState() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  const type = typeof navigator !== "undefined" ? String(navigator.connection?.effectiveType || "").toLowerCase() : "";
  return ["slow-2g", "2g"].includes(type) ? "poor" : "online";
}

export default function ConnectionStatusBanner() {
  const [state, setState] = useState(readInitialState);

  useEffect(() => {
    const onOffline = () => setState("offline");
    const onOnline = () => setState(readInitialState());
    const onState = (event) => {
      const next = event?.detail?.state;
      if (["online", "poor", "offline"].includes(next)) setState(next);
    };
    const onConnectionChange = () => setState(readInitialState());
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    window.addEventListener("revelacode:connection-state", onState);
    navigator.connection?.addEventListener?.("change", onConnectionChange);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("revelacode:connection-state", onState);
      navigator.connection?.removeEventListener?.("change", onConnectionChange);
    };
  }, []);

  if (state === "online") return null;
  const offline = state === "offline";
  const Icon = offline ? WifiOff : SignalLow;
  return (
    <div role="status" aria-live="polite" className={`mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${offline ? "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"}`}>
      <Icon size={15} className="shrink-0"/>
      <span>{offline ? "Offline — saved content remains available on this device." : "Poor connection — some live features may take longer. Your saved work remains available."}</span>
    </div>
  );
}
