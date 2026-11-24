import React, { useEffect, useRef, useState } from "react";
import { WifiOff, SignalLow } from "lucide-react";

function readInitialState() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  const connection = typeof navigator !== "undefined" ? navigator.connection : null;
  const type = String(connection?.effectiveType || "").toLowerCase();
  return ["slow-2g", "2g"].includes(type) || Number(connection?.rtt || 0) > 700 ? "poor" : "online";
}

export default function ConnectionStatusBanner() {
  const [state, setState] = useState(readInitialState);
  const [visible, setVisible] = useState(() => readInitialState() !== "online");
  const dismissTimer = useRef(null);

  useEffect(() => {
    const showForFourSeconds = next => {
      if (!["online", "poor", "offline"].includes(next)) return;
      setState(next);
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
      if (next === "online") {
        setVisible(false);
        dismissTimer.current = null;
        return;
      }
      setVisible(true);
      dismissTimer.current = window.setTimeout(() => {
        setVisible(false);
        dismissTimer.current = null;
      }, 4000);
    };
    const onOffline = () => showForFourSeconds("offline");
    const onOnline = () => showForFourSeconds(readInitialState());
    const onState = event => showForFourSeconds(event?.detail?.state);
    const onConnectionChange = () => showForFourSeconds(readInitialState());
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    window.addEventListener("revelacode:connection-state", onState);
    window.addEventListener("revelacode:connection-poor", () => showForFourSeconds("poor"));
    window.addEventListener("revelacode:connection-restored", () => showForFourSeconds(readInitialState()));
    navigator.connection?.addEventListener?.("change", onConnectionChange);
    if (state !== "online") showForFourSeconds(state);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("revelacode:connection-state", onState);
      navigator.connection?.removeEventListener?.("change", onConnectionChange);
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
    };
  }, []);

  if (!visible || state === "online") return null;
  const offline = state === "offline";
  const Icon = offline ? WifiOff : SignalLow;
  return (
    <div role="status" aria-live="polite" className={`mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-opacity motion-reduce:transition-none ${offline ? "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"}`}>
      <Icon size={15} className="shrink-0" />
      <span>{offline ? "Offline — saved content remains available on this device." : "Poor connection — some live features may take longer. Your saved work remains available."}</span>
    </div>
  );
}
