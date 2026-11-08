import React, { useEffect, useState } from "react";
import { Bell, Download, ExternalLink, Info, Sparkles, X } from "lucide-react";
import { useNotifications } from "@/components/hooks/useNotifications.jsx";

function destinationFor(item) {
  const raw = String(item?.hub || item?.destination || item?.target || "").toLowerCase();
  const aliases = { ai: "ai", revelaai: "ai", faith: "faith", scripture: "faith", elimu: "education", school: "education", biashara: "biashara", shamba: "shamba", community: "community", jumuiya: "community", home: "home" };
  return aliases[raw] || "";
}

export default function SystemHomeNotifications({ onNavigate }) {
  const { notifications, loading, markAsRead } = useNotifications(30000);
  const [systemItems, setSystemItems] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());

  useEffect(() => {
    const receive = (event) => {
      const item = event?.detail;
      if (!item || !item.title) return;
      const id = String(item.id || `system-${Date.now()}`);
      setSystemItems((current) => [{ ...item, id, timestamp: item.timestamp || new Date().toISOString(), system: true }, ...current].slice(0, 8));
      setDismissed((current) => { const next = new Set(current); next.delete(id); return next; });
      window.setTimeout(() => setDismissed((current) => new Set(current).add(id)), 10000);
    };
    window.addEventListener("revelacode:system-notification", receive);
    return () => window.removeEventListener("revelacode:system-notification", receive);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const compare = (latest, installed) => {
      const a = String(latest || "").replace(/^v/i, "").split(".").map(Number);
      const b = String(installed || "").replace(/^v/i, "").split(".").map(Number);
      for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
        const left = Number(a[index] || 0), right = Number(b[index] || 0);
        if (left !== right) return left > right;
      }
      return false;
    };
    const announce = (item) => {
      if (cancelled) return;
      const id = `release-${item.platform}-${item.version}`;
      try {
        if (localStorage.getItem(`revelacode_update_seen:${id}`) === "true") return;
        localStorage.setItem(`revelacode_update_seen:${id}`, "true");
      } catch { /* Notification remains useful without persistent dismissal. */ }
      window.dispatchEvent(new CustomEvent("revelacode:system-notification", { detail: item }));
    };
    const check = async () => {
      const isAndroid = import.meta.env.VITE_ANDROID_APP === "true" ||
        /Android/i.test(navigator.userAgent) && /Capacitor|wv/i.test(navigator.userAgent);
      const isWindowsDesktop = import.meta.env.VITE_TAURI_APP === "true" || Boolean(window.__TAURI__ || window.__TAURI_INTERNALS__);
      if (isAndroid) {
        try {
          const { App } = await import("@capacitor/app");
          const installed = await App.getInfo();
          const response = await fetch("https://api.github.com/repos/musombi123/RevelaCode-Android/releases/latest", { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
          if (!response.ok) throw new Error("release lookup unavailable");
          const release = await response.json();
          const apk = (release.assets || []).find((asset) => String(asset.name).toLowerCase().endsWith(".apk"));
          if (apk && compare(release.tag_name, installed.version)) announce({
            id: `android-${release.tag_name}`, platform: "android", version: release.tag_name,
            title: `RevelaCode Android ${release.tag_name} is available`,
            message: "A newer Android installer is ready. Download the APK and install it to update this app.",
            download_url: apk.browser_download_url,
          });
        } catch { /* Release checks must never interrupt app startup. */ }
      }
      if (isWindowsDesktop) {
        try {
          let installed = String(import.meta.env.VITE_WINDOWS_APP_VERSION || "");
          if (!installed && window.__TAURI__?.app?.getVersion) installed = await window.__TAURI__.app.getVersion();
          if (!installed) return;
          const response = await fetch("https://api.github.com/repos/musombi123/RevelaCode-Windows/releases/latest", { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
          if (!response.ok) throw new Error("release lookup unavailable");
          const release = await response.json();
          const installer = (release.assets || []).find((asset) => /setup.*\.exe$/i.test(asset.name));
          if (installer && compare(release.tag_name, installed)) announce({
            id: `windows-${release.tag_name}`, platform: "windows", version: release.tag_name,
            title: `RevelaCode for Windows ${release.tag_name} is available`,
            message: "A newer Windows installer is ready. Download and run it to update your desktop app.",
            download_url: installer.browser_download_url,
          });
        } catch { /* Release checks must never interrupt app startup. */ }
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timers = notifications.map((item) => window.setTimeout(
      () => setDismissed((current) => new Set(current).add(String(item.id))),
      10000
    ));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [notifications]);

  const items = [
    ...systemItems,
    ...notifications.slice(0, 5).map((item) => ({ ...item, system: false })),
  ].filter((item) => !dismissed.has(String(item.id))).slice(0, 6);

  if (loading && !items.length) return null;
  if (!items.length) return null;

  const openItem = (item) => {
    if (!item.system && !item.read) void markAsRead?.(item.id);
    const hub = destinationFor(item);
    if (hub) onNavigate?.(hub);
    else if (item.url || item.download_url) window.open(item.url || item.download_url, "_blank", "noopener,noreferrer");
    else if (item.action === "open-ai") onNavigate?.("ai");
    setDismissed((current) => new Set(current).add(String(item.id)));
  };

  return (
    <section aria-label="Recent notifications" className="mx-auto mt-5 w-full max-w-6xl space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><Bell size={16}/> Notifications</div>
        <span className="text-[10px] font-semibold text-slate-400">Auto-dismiss after 10 seconds</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const title = item.title || "RevelaCode notification";
          const body = item.text || item.message || item.body || item.description || "";
          const isUpdate = /update|version|apk|windows/i.test(title + " " + body);
          const Icon = isUpdate ? Download : item.system ? Sparkles : Info;
          return (
            <article key={item.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><Icon size={17}/></span>
              <button type="button" onClick={() => openItem(item)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">{title}</span>
                {body && <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-600 dark:text-slate-300">{body}</span>}
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">{item.download_url || item.url ? "Open update" : "Open notification"} <ExternalLink size={11}/></span>
              </button>
              <button type="button" onClick={() => setDismissed((current) => new Set(current).add(String(item.id)))} aria-label="Dismiss notification" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={14}/></button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
