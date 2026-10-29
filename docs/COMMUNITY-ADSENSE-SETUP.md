# RevelaCode Faith and Community advertising setup

The RevelaCode frontend includes the AdSense publisher loader and account verification meta tag in `index.html`. The deployed site also serves `public/ads.txt` at the root URL `/ads.txt`. The file already contains the publisher authorization line:

```text
google.com, pub-5357444506450550, DIRECT, f08c47fec0942fa0
```

## Web advertising

- **Faith Hub:** a clearly labelled ad placement is shown on the Faith dashboard.
- **Community Hub:** the live feed inserts a labelled in-feed ad after every five posts where there are more posts below it. If a non-empty feed has fewer than five posts, one labelled placement appears after the posts.
- Ads never gate Bible reading, study materials, or Community participation. Do not ask users to click ads, and keep ads visually distinct from posts.

The Community in-feed component uses the existing slot ID `8625467538` as its default, matching the older `CommunityAdCard` in the repository. To override it with the active slot ID from AdSense, set this build-time Render environment variable:

```env
VITE_ADSENSE_COMMUNITY_SLOT_ID=YOUR_REAL_AD_UNIT_SLOT_ID
```

The existing variable `VITE_ADSENSE_COMMUNITY_SLOT` is also accepted for compatibility. The optional `VITE_ADSENSE_COMMUNITY_LAYOUT_KEY` overrides the in-feed layout key. Use the numeric **Ad unit ID** (not the publisher ID) and the layout key generated for that in-feed unit in AdSense. If `8625467538` is not the active in-feed unit in your AdSense account, set the correct value before deploying.

After changing any `VITE_*` variable, trigger a fresh frontend build/deploy because Vite embeds these values at build time. Confirm in AdSense that `revelacode.co.ke` is approved, the ad unit is active, and the site has no policy or consent blockers. Ad fill is not guaranteed immediately and a correctly inserted unit may still return no ad.

## Android advertising

The Android app uses the separate native AdMob path; the AdSense JavaScript is for the web frontend. The native component deliberately falls back to Google's test ad IDs until both production AdMob IDs are configured. Test ads do not generate production revenue. Set and verify the Android AdMob app ID and native ad-unit ID separately before expecting Android revenue.

## Verification checklist

1. Deploy the reviewed frontend changes.
2. Check `https://revelacode.co.ke/ads.txt` returns the publisher line above.
3. View the page source for `https://revelacode.co.ke/` and confirm the `google-adsense-account` meta tag and one AdSense loader script are present in `<head>`.
4. Open the Community feed with a non-empty list: the feed should include an in-feed placement after five posts, or one placement at the end of a shorter feed.
5. Verify the placement in browser developer tools and in AdSense. Do not click your own live ads to test them.
6. Confirm that ad failure or offline mode does not block feed posts, reading, or navigation.

Source changes alone do not prove that the Google account, domain, consent configuration, ad-unit ID, or live ad-fill status is approved. Those must be checked after deployment.
