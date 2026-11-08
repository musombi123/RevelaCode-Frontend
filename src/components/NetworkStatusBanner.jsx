import React, { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function NetworkStatusBanner() {
  const [status, setStatus] = useState(() => typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online");
  useEffect(() => {
    const offline = () => setStatus("offline");
    const online = () => setStatus("online");
    const poor = () => setStatus("poor");
    const restored = () => setStatus("online");
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    window.addEventListener("revelacode:connection-poor", poor);
    window.addEventListener("revelacode:connection-restored", restored);
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
      window.removeEventListener("revelacode:connection-poor", poor);
      window.removeEventListener("revelacode:connection-restored", restored);
    };
  }, []);
  if (status === "online") return null;
  const offline = status === "offline";
  return <div role="status" aria-live="polite" className={`flex shrink-0 items-center justify-center gap-2 px-3 py-2 text-xs font-semibold ${offline ? "bg-slate-800 text-white" : "bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-100"}`}>
    {offline ? <WifiOff size={14}/> : <Wifi size={14}/>}
    {offline ? "No internet connection. Offline content is available where downloaded." : "Poor connection. Some features may take longer to load. Your workspace is still available."}
  </div>;
}
