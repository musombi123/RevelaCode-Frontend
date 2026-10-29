# RevelaCode Faith and Community advertising setup

The frontend has the Google AdSense publisher loader and site-verification meta tag in `index.html`. The repository already serves the supplied authorization line from `public/ads.txt` as `https://revelacode.co.ke/ads.txt`:

```text
google.com, pub-5357444506450550, DIRECT, f08c47fec0942fa0
```

## Web ad placements

- **Faith Hub:** renders a labelled responsive display placement when a Faith/display slot is configured.
- **Community Hub:** places a labelled in-feed ad after every five posts where more posts follow. If a non-empty feed has fewer than five posts, one labelled placement appears after the feed. Empty feeds do not show ad placeholders.
- Ads never gate Bible reading, study materials, or Community participation. Do not ask users to click ads, and keep ads visually distinct from posts.

Configure the numeric **Ad unit ID** from AdSense in Render as a build-time environment variable:

```env
VITE_ADSENSE_COMMUNITY_SLOT_ID=YOUR_COMMUNITY_IN_FEED_SLOT_ID
VITE_ADSENSE_COMMUNITY_LAYOUT_KEY=YOUR_ADSENSE_IN_FEED_LAYOUT_KEY
VITE_ADSENSE_FAITH_SLOT=YOUR_FAITH_DISPLAY_SLOT_ID
```

The Community in-feed code defaults to slot ID `8625467538`, because that ID was already present in `CommunityAdCard.jsx`. Set `VITE_ADSENSE_COMMUNITY_SLOT_ID` if the active in-feed unit in your AdSense account is different. The in-feed layout key also has the previous repository default but should match the layout key generated for that specific AdSense in-feed unit.

For compatibility, the Faith display placement also accepts the existing `VITE_ADSENSE_COMMUNITY_SLOT` variable when `VITE_ADSENSE_FAITH_SLOT` is not set. Use display format for the Faith slot and in-feed format for the Community slot; avoid sharing one Ad unit ID between different formats if AdSense created separate units for them.

After changing any `VITE_*` variable, trigger a fresh frontend build/deploy because Vite embeds these values at build time. Confirm in AdSense that `revelacode.co.ke` is approved, the configured units are active, and the site has no policy or consent blockers. Ad fill is not guaranteed immediately and a correctly inserted unit may still return no ad.

## Android AdMob placements

Android uses the Capacitor AdMob native feed API; the AdSense JavaScript is web-only. The same reusable placement component selects separate native units for Faith and Community:

```env
VITE_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
VITE_ADMOB_FAITH_NATIVE_AD_UNIT_ID=ca-app-pub-XXXXXXXXXXXXXXXX/FAITH_UNIT_ID
VITE_ADMOB_COMMUNITY_NATIVE_AD_UNIT_ID=ca-app-pub-XXXXXXXXXXXXXXXX/COMMUNITY_UNIT_ID
```

Use the app ID from your AdMob Android app registration and create two **Native** ad units, one for Faith and one for Community. Replace the example strings with the real IDs from AdMob. The app ID is applied to the generated Android manifest by `npm run android:sync:admob`; this helper now validates either native unit independently. Each slot uses Google's official test native ID until both the app ID and that specific slot's production unit ID are configured. Test ads do not generate production revenue.

After changing the local `.env`, run:

```powershell
npm run build
npm run android:sync:admob
cd android
.\\gradlew.bat assembleDebug
```

Set the same `VITE_*` values in your native APK build environment as well. A web-only Render deployment does not alter an APK already installed on a device. Never click live production ads while testing.

## Verification checklist

1. Deploy the reviewed frontend changes.
2. Check `https://revelacode.co.ke/ads.txt` returns the publisher authorization line above.
3. View the page source for `https://revelacode.co.ke/` and confirm the `google-adsense-account` meta tag and one AdSense loader script are present in `<head>`.
4. Open the Community feed with more than five posts: a labelled in-feed placement should appear between posts. A shorter, non-empty feed should show one placement at the end.
5. Verify the placements in browser developer tools and in AdSense. Never click your own live ads to test them.
6. Confirm ad failure or offline mode does not block feed posts, Scripture, study resources, or navigation.

Source changes alone do not prove that the Google account, domain, consent configuration, ad-unit IDs, or live ad-fill status are approved. Those must be checked after deployment.
