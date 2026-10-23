import React, { useEffect, useRef } from "react";

const ENV = import.meta.env || {};
const PUBLISHER_ID = "ca-pub-5357444506450550";
const AD_SLOT_ID = String(ENV.VITE_ADSENSE_COMMUNITY_SLOT_ID || "8625467538").trim();
const AD_LAYOUT_KEY = String(ENV.VITE_ADSENSE_COMMUNITY_LAYOUT_KEY || "-6t+ed+2i-1n-4w").trim();

/**
 * Manual Google AdSense In-feed ad.
 * This component is only mounted by CommunityFeed, never by the site home.
 * Auto ads must be disabled in AdSense so the global library does not inject
 * automatic placements on unrelated pages.
 */
export default function CommunityAdCard() {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!AD_SLOT_ID || !AD_LAYOUT_KEY || !cardRef.current) return;

    const adElement = cardRef.current.querySelector("ins.adsbygoogle");
    if (!adElement) return;
    if (
      adElement.dataset.adsenseRequested === "true" ||
      adElement.getAttribute("data-adsbygoogle-status")
    ) {
      return;
    }

    adElement.dataset.adsenseRequested = "true";
    try {
      // AdSense's official loader is included by index.html. This pushes only
      // the explicitly declared unit inside this Community feed card.
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      adElement.dataset.adsenseRequested = "false";
      console.warn("Community AdSense placement failed.", error);
    }
  }, []);

  // Do not show a fake ad or an empty placeholder without a real unit ID.
  if (!AD_SLOT_ID || !AD_LAYOUT_KEY) return null;

  return (
    <article
      ref={cardRef}
      aria-label="Advertisement"
      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:text-slate-400">
          Advertisement
        </span>
        <span className="text-[10px] text-slate-400">Sponsored content</span>
      </div>

      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={AD_SLOT_ID}
        data-ad-format="fluid"
        data-ad-layout-key={AD_LAYOUT_KEY}
        data-full-width-responsive="true"
      />
    </article>
  );
}
