import React, { createElement, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  AdmobConsentStatus,
  NativeAdFeed,
  NativeAdPluginEvents,
  NativeAdTemplate,
} from "@capacitor-community/admob";

const ADSENSE_CLIENT = "ca-pub-5357444506450550";
const COMMUNITY_AD_SLOT = String(
  import.meta.env.VITE_ADSENSE_COMMUNITY_SLOT || "",
).trim();

const ADMOB_APP_ID = String(
  import.meta.env.VITE_ADMOB_ANDROID_APP_ID || "",
).trim();
const ADMOB_NATIVE_UNIT_ID = String(
  import.meta.env.VITE_ADMOB_COMMUNITY_NATIVE_AD_UNIT_ID || "",
).trim();

const TEST_ADMOB_APP_ID = "ca-app-pub-3940256099942544~3347511713";
const TEST_NATIVE_AD_UNIT_ID = "ca-app-pub-3940256099942544/2247696110";
const HAS_PRODUCTION_ADMOB_IDS = Boolean(ADMOB_APP_ID && ADMOB_NATIVE_UNIT_ID);
const NATIVE_AD_UNIT_ID = HAS_PRODUCTION_ADMOB_IDS
  ? ADMOB_NATIVE_UNIT_ID
  : TEST_NATIVE_AD_UNIT_ID;
const IS_TESTING_ADS = !HAS_PRODUCTION_ADMOB_IDS;

const NATIVE_FEED_ID = "revelacode-community-feed";
const NATIVE_SLOT_KEY = "community-sponsored-placement";

let admobInitializePromise = null;

function isAndroidNativeApp() {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

async function initializeAdMobWithConsent() {
  let consent = await AdMob.requestConsentInfo();

  if (
    consent.isConsentFormAvailable &&
    consent.status === AdmobConsentStatus.REQUIRED
  ) {
    consent = await AdMob.showConsentForm();
  }

  if (!consent.canRequestAds) return false;

  if (!admobInitializePromise) {
    admobInitializePromise = AdMob.initialize().catch((error) => {
      admobInitializePromise = null;
      throw error;
    });
  }

  await admobInitializePromise;
  return true;
}

/**
 * Compact native AdMob creative for the Community feed.
 *
 * The NativeAdFeed API is marked Preview by the plugin maintainers. It runs
 * only inside the Android APK; the existing AdSense unit remains the web path.
 * Without BOTH real AdMob IDs, it deliberately uses Google's official demo IDs.
 */
function CommunityNativeAdMobUnit() {
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    let active = true;
    let feed = null;
    let loadedHandle = null;
    let failedHandle = null;
    let timeoutId = null;

    const settle = (nextStatus) => {
      if (!active) return;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      setStatus(nextStatus);
    };

    async function setup() {
      try {
        const consentReady = await initializeAdMobWithConsent();
        if (!active || !consentReady) {
          settle("failed");
          return;
        }

        feed = await NativeAdFeed.create({
          feedId: NATIVE_FEED_ID,
          adId: NATIVE_AD_UNIT_ID,
          template: NativeAdTemplate.Small,
          isTesting: IS_TESTING_ADS,
          style: {
            backgroundColor: "#0b1220",
            cornerRadius: 12,
            headlineColor: "#f8fafc",
            callToActionBackgroundColor: "#0a74da",
          },
        });

        if (!active) {
          await feed.destroy();
          return;
        }

        loadedHandle = await feed.addListener(
          NativeAdPluginEvents.Loaded,
          (event) => {
            if (event.slotKey === NATIVE_SLOT_KEY) settle("loaded");
          },
        );
        failedHandle = await feed.addListener(
          NativeAdPluginEvents.FailedToLoad,
          (event) => {
            if (event.slotKey === NATIVE_SLOT_KEY) settle("failed");
          },
        );

        settle("loading");
        timeoutId = window.setTimeout(() => settle("failed"), 15000);
      } catch (error) {
        console.warn("Community AdMob placement is unavailable.", error);
        settle("failed");
      }
    }

    setup();

    return () => {
      active = false;
      if (timeoutId !== null) window.clearTimeout(timeoutId);

      void (async () => {
        try {
          await loadedHandle?.remove();
        } catch {
          // The native feed may already have released its listeners.
        }
        try {
          await failedHandle?.remove();
        } catch {
          // The native feed may already have released its listeners.
        }
        try {
          await feed?.destroy();
        } catch {
          // A failed or already-destroyed feed should not block navigation.
        }
      })();
    };
  }, []);

  if (!isAndroidNativeApp() || status === "idle" || status === "failed") {
    return null;
  }

  return (
    <aside
      aria-label="Sponsored advertisement"
      className="my-5 rounded-2xl border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-slate-900"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
          Advertisement
        </span>
        <span className="text-[9px] text-slate-400">Sponsored</span>
      </div>
      {createElement("capacitor-admob-native", {
        "feed-id": NATIVE_FEED_ID,
        "slot-key": NATIVE_SLOT_KEY,
      })}
      {status === "loading" && (
        <span className="sr-only">Loading advertisement</span>
      )}
    </aside>
  );
}

function CommunityWebAdSenseUnit() {
  const adRef = useRef(null);
  const pushAttempted = useRef(false);

  useEffect(() => {
    if (
      !/^\d+$/.test(COMMUNITY_AD_SLOT) ||
      !adRef.current ||
      pushAttempted.current
    ) {
      return;
    }
    if (typeof window === "undefined") return;

    pushAttempted.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      pushAttempted.current = false;
      console.warn("Community AdSense unit could not be initialized.", error);
    }
  }, []);

  if (!/^\d+$/.test(COMMUNITY_AD_SLOT) || !ADSENSE_CLIENT) return null;

  return (
    <aside
      aria-label="Advertisement"
      className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:p-4"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
          Advertisement
        </span>
        <span className="text-[9px] text-slate-400">Google AdSense</span>
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "100px" }}
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={COMMUNITY_AD_SLOT}
      />
    </aside>
  );
}

export default function CommunityAdSenseUnit() {
  return isAndroidNativeApp() ? (
    <CommunityNativeAdMobUnit />
  ) : (
    <CommunityWebAdSenseUnit />
  );
}
