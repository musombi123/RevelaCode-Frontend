import React from "react";
import { Capacitor } from "@capacitor/core";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";
import { ThemeProvider } from "./components/hooks/useTheme.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { HistoryProvider } from "./context/HistoryContext.jsx";
import { warmCrossReferenceDataset, warmFaithStudyCache } from "./components/study/studyMaterialCache.js";
import "./index.css";

const ADSENSE_SCRIPT_URL =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5357444506450550";

const launchSplash = (() => {
  if (typeof window === "undefined") return null;

  const isAndroid =
    Capacitor.isNativePlatform() ||
    import.meta.env.VITE_ANDROID_APP === "true";
  const isWindowsDesktop =
    import.meta.env.VITE_TAURI_APP === "true" ||
    Boolean(window.__TAURI_INTERNALS__);

  if (!isAndroid && !isWindowsDesktop) return null;

  const element = document.getElementById("revelacode-launch-splash");
  const image = element?.querySelector("img");
  if (!element || !image) return null;

  image.src = isAndroid ? "/splash/android.svg" : "/splash/desktop.svg";
  element.hidden = false;

  const startedAt = performance.now();
  let finishScheduled = false;

  return {
    finish() {
      if (finishScheduled || !element.isConnected) return;
      finishScheduled = true;
      const minimumVisibleMs = 950;
      const remaining = Math.max(0, minimumVisibleMs - (performance.now() - startedAt));
      window.setTimeout(() => {
        element.classList.add("is-hidden");
        window.setTimeout(() => element.remove(), 380);
      }, remaining);
    },
  };
})();

// AdSense is a web publisher integration. Native Android uses the AdMob SDK instead.
if (
  typeof window !== "undefined" &&
  !Capacitor.isNativePlatform() &&
  !document.querySelector("script[data-revelacode-adsense]")
) {
  const adSenseScript = document.createElement("script");
  adSenseScript.async = true;
  adSenseScript.src = ADSENSE_SCRIPT_URL;
  adSenseScript.crossOrigin = "anonymous";
  adSenseScript.dataset.revelacodeAdsense = "true";
  document.head.appendChild(adSenseScript);
}

// Native Android already ships its application shell inside the APK. Keep
// Service Worker installation and shell-cache operations off the launch-critical
// path; optional study data is warmed later, after the first screen is available.
if (typeof window !== "undefined") {
  if (Capacitor.isNativePlatform()) {
    // Remove only this app's old web shell worker/cache left by earlier APK builds.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations
          .filter((registration) => [registration.active, registration.waiting, registration.installing]
            .some((worker) => {
              if (!worker?.scriptURL) return false;
              try { return new URL(worker.scriptURL).pathname.endsWith("/revelacode-sw.js"); }
              catch { return false; }
            }))
          .map((registration) => registration.unregister())))
        .catch(() => {});
    }
    if ("caches" in window) {
      window.caches.keys()
        .then((keys) => Promise.all(keys
          .filter((key) => key.startsWith("revelacode-app-shell-"))
          .map((key) => window.caches.delete(key))))
        .catch(() => {});
    }

    // Begin optional offline-data caching only after the APK's first screen has
    // had time to render. Never wait for these downloads before mounting React.
    const scheduleAndroidOfflineWarmup = () => {
      let started = false;
      const runWarmup = () => {
        if (started) return;
        started = true;
        if (navigator.onLine === false) return;

        Promise.resolve()
          .then(() => warmFaithStudyCache())
          .then((faithResult) => warmCrossReferenceDataset()
            .then((referenceResult) => ({ faithResult, referenceResult })))
          .then(({ faithResult, referenceResult }) => {
            console.info("[RevelaCode offline] Android background cache warm-up finished.", {
              faith: faithResult?.source || "unavailable",
              faithMaterials: faithResult?.count || 0,
              crossReferences: referenceResult?.source || "unavailable",
              crossReferenceCount: referenceResult?.count || 0,
            });
          })
          .catch((error) => {
            console.warn("[RevelaCode offline] Android background cache warm-up was skipped.", error);
          });
      };

      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(runWarmup, { timeout: 12000 });
      } else {
        window.setTimeout(runWarmup, 5000);
      }
    };

    if (document.readyState === "complete") {
      scheduleAndroidOfflineWarmup();
    } else {
      window.addEventListener("load", scheduleAndroidOfflineWarmup, { once: true });
    }
  } else {
    // Keep web offline support, but run heavy prefetch work only after first paint,
    // when the browser is idle. Failures are isolated from the React application.
    const prepareOfflineStudy = () => {
      const runWhenIdle = () => {
        Promise.resolve().then(() => warmFaithStudyCache()).catch(() => {});
        Promise.resolve().then(() => warmCrossReferenceDataset()).catch(() => {});
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.register("/revelacode-sw.js").catch(() => {});
        }
      };

      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(runWhenIdle, { timeout: 8000 });
      } else {
        window.setTimeout(runWhenIdle, 2500);
      }
    };

    if (document.readyState === "complete") prepareOfflineStudy();
    else window.addEventListener("load", prepareOfflineStudy, { once: true });
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <HistoryProvider>
            <App />
          </HistoryProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("revelacode-startup-loader")?.remove()));
window.setTimeout(() => document.getElementById("revelacode-startup-loader")?.remove(), 12000);

if (import.meta.env.DEV && typeof window !== "undefined") {
  const showStartupError = (message) => {
    let panel = document.getElementById("revelacode-dev-error");
    if (!panel) {
      panel = document.createElement("pre");
      panel.id = "revelacode-dev-error";
      panel.style.cssText = "position:fixed;inset:12px;z-index:2147483647;overflow:auto;white-space:pre-wrap;padding:18px;border:1px solid #ef4444;border-radius:12px;background:#1f0b10;color:#fecaca;font:13px/1.5 monospace";
      document.body.appendChild(panel);
    }
    panel.textContent = "RevelaCode startup error\\n\\n" + message;
  };
  window.addEventListener("error", (event) => showStartupError(event.error?.stack || event.message || "Unknown window error"));
  window.addEventListener("unhandledrejection", (event) => showStartupError(event.reason?.stack || String(event.reason || "Unhandled promise rejection")));
}

if (launchSplash) {
  // Keep the splash visible until the first React frame is painted, with a
  // bounded timeout so a rendering failure cannot leave a permanent overlay.
  window.requestAnimationFrame(() =>
    window.requestAnimationFrame(() => launchSplash.finish())
  );
  window.setTimeout(() => launchSplash.finish(), 4500);
}
