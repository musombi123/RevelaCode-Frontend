import React, { useEffect, useRef } from "react";

const ADSENSE_CLIENT =
  String(import.meta.env.VITE_ADSENSE_CLIENT_ID || "ca-pub-5357444506450550").trim();
const COMMUNITY_AD_SLOT =
  String(import.meta.env.VITE_ADSENSE_COMMUNITY_SLOT || "").trim();
const COMMUNITY_LAYOUT_KEY = "-6t+ed+2i-1n-4w";

/**
 * Explicit, labelled Community in-feed ad unit.
 *
 * index.html already loads the AdSense script. A real slot ID is required
 * through VITE_ADSENSE_COMMUNITY_SLOT; no placeholder slot is fabricated.
 * When not configured, this component renders nothing (no empty ad space).
 */
export default function CommunityAdSenseUnit() {
  const adRef = useRef(null);
  const pushAttempted = useRef(false);

  useEffect(() => {
    if (!COMMUNITY_AD_SLOT || !adRef.current || pushAttempted.current) return;
    if (typeof window === "undefined") return;

    pushAttempted.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      pushAttempted.current = false;
      console.warn("Community AdSense unit could not be initialized.", error);
    }
  }, []);

  if (!COMMUNITY_AD_SLOT || !ADSENSE_CLIENT) return null;

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
        data-ad-format="fluid"
        data-ad-layout-key={COMMUNITY_LAYOUT_KEY}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={COMMUNITY_AD_SLOT}
      />
    </aside>
  );
}
