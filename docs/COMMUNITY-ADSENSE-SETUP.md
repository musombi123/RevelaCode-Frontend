# Community Google AdSense deployment setup

The Community dashboard and Community feed use the explicit, labelled `CommunityAdSenseUnit`. They intentionally render no blank ad box and do not invent an ad-unit ID.

Before publishing this branch, set the following **build-time** environment variable in the RevelaCode Frontend deployment (Render):

```env
VITE_ADSENSE_COMMUNITY_SLOT=YOUR_REAL_AD_UNIT_SLOT_ID
```

Use the numeric **Ad unit ID** from Google AdSense (Ads → By ad unit → create/select a responsive display ad unit → copy the `data-ad-slot` value). Do not use the publisher ID in this variable. The publisher loader in `index.html` already uses RevelaCode's configured publisher ID.

After setting the value, trigger a fresh frontend build/deploy because Vite embeds `VITE_*` variables at build time. Then verify that the AdSense site is approved, the ad unit is active, and the browser console has no AdSense errors. Ads may not fill immediately, even when configured correctly.

The placement is labelled **Advertisement / Google AdSense** and appears within the Community feed as well as the Community home surface. Keep sponsorship labels visible, do not encourage users to click ads, and follow Google AdSense program policies and the site's privacy/consent requirements.
