import { useEffect } from "react";
import { readCachedApiResponse, writeCachedApiResponse } from "@/services/offlineHubSync.js";

const API = String(
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

function currentKenyaQuarter() {
  const parts = new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((item) => item.type === "year")?.value);
  const month = Number(parts.find((item) => item.type === "month")?.value);
  return { year, quarter: Math.ceil(month / 3) };
}

export default function SDAQuarterlyBackgroundSync() {
  useEffect(() => {
    let active = true;
    let running = false;
    const sync = async ({ force = false } = {}) => {
      if (!active || running || typeof navigator === "undefined" || !navigator.onLine) return;
      const { year, quarter } = currentKenyaQuarter();
      const url = `${API}/api/study/sda/quarter/${year}/${quarter}`;
      const syncKey = `revelacode_sda_quarter_sync:${year}:Q${quarter}`;
      try {
        const lastSync = Number(localStorage.getItem(syncKey) || 0);
        if (!force && lastSync && Date.now() - lastSync < 24 * 60 * 60 * 1000) return;
      } catch { /* Continue with an online refresh when storage is blocked. */ }
      running = true;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("quarter_sync_failed");
        const payload = await response.json();
        if (payload?.success === false || !Array.isArray(payload?.materials)) throw new Error("quarter_sync_invalid");
        await writeCachedApiResponse("sda-quarterly-public", url, payload);
        try {
          localStorage.setItem(`sda-quarterly:${year}:${quarter}`, JSON.stringify({ payload, savedAt: Date.now() }));
          localStorage.setItem(syncKey, String(Date.now()));
        } catch { /* IndexedDB is the durable cache when available. */ }
        window.dispatchEvent(new CustomEvent("revelacode:sda-quarterly-updated", {
          detail: { year, quarter, lessonCount: payload.materials.length },
        }));
      } catch {
        // Background sync is silent. The Faith workspace reports poor/offline
        // connectivity with a user-facing message when the user opens it.
        const cached = await readCachedApiResponse("sda-quarterly-public", url).catch(() => ({ hit: false }));
        if (!cached?.hit) {
          window.dispatchEvent(new CustomEvent("revelacode:connection-state", {
            detail: { state: navigator.onLine ? "poor" : "offline" },
          }));
        }
      } finally {
        window.clearTimeout(timeout);
        running = false;
      }
    };
    sync();
    const onOnline = () => sync({ force: true });
    window.addEventListener("online", onOnline);
    const timer = window.setInterval(() => sync(), 60 * 60 * 1000);
    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
