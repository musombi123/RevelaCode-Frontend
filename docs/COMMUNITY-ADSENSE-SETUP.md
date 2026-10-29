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

## Android advertising

Android uses the separate native AdMob path; the AdSense JavaScript is for the web frontend. The native component falls back to Google's test ad IDs until both production AdMob IDs are configured. Test ads do not generate production revenue. Configure and verify the Android AdMob app ID and native ad-unit ID separately before expecting Android revenue.

## Verification checklist

1. Deploy the reviewed frontend changes.
2. Check `https://revelacode.co.ke/ads.txt` returns the publisher authorization line above.
3. View the page source for `https://revelacode.co.ke/` and confirm the `google-adsense-account` meta tag and one AdSense loader script are present in `<head>`.
4. Open the Community feed with more than five posts: a labelled in-feed placement should appear between posts. A shorter, non-empty feed should show one placement at the end.
5. Verify the placements in browser developer tools and in AdSense. Never click your own live ads to test them.
6. Confirm ad failure or offline mode does not block feed posts, Scripture, study resources, or navigation.

Source changes alone do not prove that the Google account, domain, consent configuration, ad-unit IDs, or live ad-fill status are approved. Those must be checked after deployment.
