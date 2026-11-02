# RevelaCode Faith and Community AdSense setup

The frontend includes the Google AdSense publisher loader and site-verification meta tag in `index.html`. The repository serves this publisher authorization line from `public/ads.txt` at `https://revelacode.co.ke/ads.txt`:

```text
google.com, pub-5357444506450550, DIRECT, f08c47fec0942fa0
```

## Web ad-unit inventory

Use distinct AdSense units for the different formats and surfaces:

| AdSense ad-unit name to use | In-app location | Build environment variable |
|---|---|---|
| `RevelaCode - Community Feed - In-feed` | Community feed | `VITE_ADSENSE_COMMUNITY_SLOT_ID` |
| `RevelaCode - Community Home - Display` | Community overview | `VITE_ADSENSE_COMMUNITY_DISPLAY_SLOT_ID` |
| `RevelaCode - Faith Overview - Display` | Faith landing page | `VITE_ADSENSE_FAITH_SLOT` |

The Community feed retains the existing repository slot default `8625467538`; set the environment variable when the active AdSense unit in your account has a different ID. The Community Home slot has no fallback: it will not borrow the Faith display slot. The Faith display setting retains the legacy `VITE_ADSENSE_COMMUNITY_SLOT` fallback for backward compatibility.

For Community Feed, configure an AdSense in-feed unit and its matching `VITE_ADSENSE_COMMUNITY_LAYOUT_KEY`. For Community Home and Faith, configure responsive display units. Keep the publisher/client ID separate from the numeric Ad Unit IDs.

## Placement rules

- **Community Feed:** one labelled in-feed unit after the seventh organic post; for a non-empty feed shorter than seven posts, one unit at the end. No ad is inserted while a user is searching.
- **Community Home:** one separate labelled display unit after the latest-post preview.
- **Faith:** one labelled display unit on the Faith landing page. Do not interrupt Scripture, lessons, prayer, audio, or focused study screens.
- **Elimu, Shamba operations and diagnostics, Biashara finance/order flows, RevelaAI conversations, and global navigation:** no AdSense units.
- Do not put ads next to bottom navigation controls or in places that could cause accidental clicks.

## Configure the frontend deployment

Set these as **build-time** environment variables in the frontend deployment:

```env
VITE_ADSENSE_COMMUNITY_SLOT_ID=YOUR_COMMUNITY_IN_FEED_SLOT_ID
VITE_ADSENSE_COMMUNITY_LAYOUT_KEY=YOUR_COMMUNITY_IN_FEED_LAYOUT_KEY
VITE_ADSENSE_COMMUNITY_DISPLAY_SLOT_ID=YOUR_COMMUNITY_DISPLAY_SLOT_ID
VITE_ADSENSE_FAITH_SLOT=YOUR_FAITH_DISPLAY_SLOT_ID
```

After changing any `VITE_*` variable, trigger a fresh frontend build/deploy because Vite embeds those values at build time. Confirm that `revelacode.co.ke` is approved in AdSense, the configured units are active, and there are no account or consent blockers. Ad fill is not guaranteed immediately.

## Android

The Android APK uses the separate native AdMob inventory documented in [ADMOB_ANDROID_SETUP.md](./ADMOB_ANDROID_SETUP.md). AdSense JavaScript is the web path only.

## Verification checklist

1. Deploy the reviewed frontend build.
2. Check `https://revelacode.co.ke/ads.txt` returns the publisher authorization line above.
3. Confirm the AdSense loader and account meta tag are present in the deployed page source.
4. Check Community Home, Community Feed, and Faith independently; each must use its own configured unit.
5. Confirm ad failure or offline mode never blocks Community posts, Scripture, study resources, or navigation.
6. Never click your own live ads to test them.

Source changes alone do not prove that the Google account, domain, consent configuration, ad-unit IDs, or live ad-fill status are approved. Those must be checked in the Google consoles after deployment.
