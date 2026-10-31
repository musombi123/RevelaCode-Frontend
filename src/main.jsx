import React from "react";
import { Capacitor } from "@capacitor/core";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./components/hooks/useTheme.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { HistoryProvider } from "./context/HistoryContext.jsx";
import { warmCrossReferenceDataset, warmFaithStudyCache } from "./components/study/studyMaterialCache.js";
import "./index.css";

const ADSENSE_SCRIPT_URL =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5357444506450550";

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

// Native Android already ships its application shell inside the APK. Do not make
// app launch depend on Service Worker installation, Cache Storage, or bulk study
// downloads: older Android WebViews can stall on those APIs during first launch.
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <HistoryProvider>
          <App />
        </HistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
