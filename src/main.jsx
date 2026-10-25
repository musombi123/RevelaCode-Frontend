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

// Prepare the local Faith catalogue and app shell as the platform opens.
// This is deliberately non-blocking; authenticated API requests stay out of the service-worker cache.
if (typeof window !== "undefined") {
  const prepareOfflineStudy = () => {
    warmFaithStudyCache().catch(() => {});
    warmCrossReferenceDataset().catch(() => {});
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/revelacode-sw.js").catch(() => {});
    }
  };
  if (document.readyState === "complete") prepareOfflineStudy();
  else window.addEventListener("load", prepareOfflineStudy, { once: true });
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
