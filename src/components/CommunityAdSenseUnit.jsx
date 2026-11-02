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

const COMMUNITY_FEED_AD_SLOT = String(
  import.meta.env.VITE_ADSENSE_COMMUNITY_SLOT_ID || "8625467538",
).trim();
const COMMUNITY_OVERVIEW_AD_SLOT = String(
  import.meta.env.VITE_ADSENSE_COMMUNITY_DISPLAY_SLOT_ID || "",
).trim();
const FAITH_DISPLAY_AD_SLOT = String(
  import.meta.env.VITE_ADSENSE_FAITH_SLOT ||
    import.meta.env.VITE_ADSENSE_COMMUNITY_SLOT ||
    "",
).trim();
const COMMUNITY_AD_LAYOUT_KEY = String(
  import.meta.env.VITE_ADSENSE_COMMUNITY_LAYOUT_KEY || "-6t+ed+2i-1n-4w",
).trim();

const ADMOB_APP_ID = String(
  import.meta.env.VITE_ADMOB_ANDROID_APP_ID || "",
).trim();
const COMMUNITY_NATIVE_AD_UNIT_ID = String(
  import.meta.env.VITE_ADMOB_COMMUNITY_NATIVE_AD_UNIT_ID || "",
).trim();
const COMMUNITY_OVERVIEW_NATIVE_AD_UNIT_ID = String(
  import.meta.env.VITE_ADMOB_COMMUNITY_OVERVIEW_NATIVE_AD_UNIT_ID || "",
).trim();
const FAITH_NATIVE_AD_UNIT_ID = String(
  import.meta.env.VITE_ADMOB_FAITH_NATIVE_AD_UNIT_ID || "",
).trim();

const AD_PLACEMENTS = {
  "community-feed": {
    feedId: "revelacode-community-feed",
    slotKey: "community-feed-sponsored-slot",
    admobUnitId: COMMUNITY_NATIVE_AD_UNIT_ID,
    adsenseSlot: COMMUNITY_FEED_AD_SLOT,
    adsenseFormat: "fluid",
  },
  "community-overview": {
    feedId: "revelacode-community-overview",
    slotKey: "community-overview-sponsored-slot",
    admobUnitId: COMMUNITY_OVERVIEW_NATIVE_AD_UNIT_ID,
    adsenseSlot: COMMUNITY_OVERVIEW_AD_SLOT,
    adsenseFormat: "auto",
  },
  "faith-overview": {
    feedId: "revelacode-faith-overview",
    slotKey: "faith-overview-sponsored-slot",
    admobUnitId: FAITH_NATIVE_AD_UNIT_ID,
    adsenseSlot: FAITH_DISPLAY_AD_SLOT,
    adsenseFormat: "auto",
  },
};

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
 * One NativeAdFeed manager and one stable native slot per visible placement.
 * Community feed rendering is capped to one instance so a screen never creates
 * competing managers with duplicate feed IDs or slot keys.
 */
function NativeAdMobPlacement({ config }) {
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

        const hasProductionIds = Boolean(ADMOB_APP_ID && config.admobUnitId);
        feed = await NativeAdFeed.create({
          feedId: config.feedId,
          ...(hasProductionIds ? { adId: config.admobUnitId } : {}),
          template: NativeAdTemplate.Small,
          isTesting: !hasProductionIds,
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
            if (event.slotKey === config.slotKey) settle("loaded");
          },
        );
        failedHandle = await feed.addListener(
          NativeAdPluginEvents.FailedToLoad,
          (event) => {
            if (event.slotKey === config.slotKey) settle("failed");
          },
        );

        settle("loading");
        timeoutId = window.setTimeout(() => settle("failed"), 15000);
      } catch (error) {
        console.warn("AdMob placement is unavailable.", error);
        settle("failed");
      }
    }

    void setup();

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
  }, [config]);

  if (!isAndroidNativeApp() || status === "idle" || status === "failed") {
    return null;
  }

  return (
    <aside
      aria-label="Sponsored advertisement"
      className="my-5 rounded-2xl border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-slate-900"
    >
      <div className="mb-1.5 flex min-h-[15px] items-center justify-between gap-2 px-1">
        <span className="inline-flex min-h-[15px] min-w-[15px] items-center text-[10px] font-black uppercase leading-[15px] tracking-[0.12em] text-slate-400">
          Advertisement
        </span>
        <span className="text-[10px] leading-[15px] text-slate-400">
          Sponsored
        </span>
      </div>
      {createElement("capacitor-admob-native", {
        "feed-id": config.feedId,
        "slot-key": config.slotKey,
      })}
      {status === "loading" && (
        <span className="sr-only">Loading advertisement</span>
      )}
    </aside>
  );
}

function WebAdSensePlacement({ config }) {
  const adRef = useRef(null);
  const pushAttempted = useRef(false);
  const adSlot = config.adsenseSlot;

  useEffect(() => {
    if (
      !/^\\d+$/.test(adSlot) ||
      !adRef.current ||
      pushAttempted.current ||
      typeof window === "undefined"
    ) {
      return;
    }

    pushAttempted.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      pushAttempted.current = false;
      console.warn("AdSense placement could not be initialized.", error);
    }
  }, [adSlot]);

  if (!/^\\d+$/.test(adSlot) || !ADSENSE_CLIENT) return null;

  return (
    <aside
      aria-label="Advertisement"
      className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:p-4"
    >
      <div className="mb-2 flex min-h-[15px] items-center justify-between gap-3">
        <span className="inline-flex min-h-[15px] min-w-[15px] items-center text-[10px] font-black uppercase leading-[15px] tracking-[0.12em] text-slate-400">
          Advertisement
        </span>
        <span className="text-[10px] leading-[15px] text-slate-400">
          Google AdSense
        </span>
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "100px" }}
        data-ad-format={config.adsenseFormat}
        data-ad-layout-key={
          config.adsenseFormat === "fluid" ? COMMUNITY_AD_LAYOUT_KEY : undefined
        }
        data-full-width-responsive="true"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
      />
    </aside>
  );
}

export default function CommunityAdSenseUnit({ placement = "faith-overview" }) {
  const config = AD_PLACEMENTS[placement] || AD_PLACEMENTS["faith-overview"];

  return isAndroidNativeApp() ? (
    <NativeAdMobPlacement config={config} />
  ) : (
    <WebAdSensePlacement config={config} />
  );
}
