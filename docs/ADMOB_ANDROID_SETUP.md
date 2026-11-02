# AdMob for the RevelaCode Android APK

## Android app

Create one Android app in AdMob:

- **App display name:** RevelaCode
- **Package name:** `com.revelacode.app`
- **Platform:** Android

Copy its **App ID** (format `ca-app-pub-...~...`) into `VITE_ADMOB_ANDROID_APP_ID`.

## Native ad-unit inventory

Create three separate **Native** ad units under the RevelaCode Android app. Use these exact names so reporting stays aligned with the code:

| AdMob ad-unit name | In-app location | ID environment variable |
|---|---|---|
| `RevelaCode - Community Feed - Native` | One in-feed placement after roughly seven organic posts | `VITE_ADMOB_COMMUNITY_NATIVE_AD_UNIT_ID` |
| `RevelaCode - Community Home - Native` | Community overview, after the latest-post preview | `VITE_ADMOB_COMMUNITY_OVERVIEW_NATIVE_AD_UNIT_ID` |
| `RevelaCode - Faith Overview - Native` | Faith landing page only | `VITE_ADMOB_FAITH_NATIVE_AD_UNIT_ID` |

Google creates the actual Ad Unit ID when you save each unit. Copy the ID in the `ca-app-pub-.../...` format; the names above are labels, not IDs.

## GitHub Actions configuration

In the **RevelaCode-Android** repository, add these Actions secrets:

| Secret name | Value |
|---|---|
| `VITE_ADMOB_ANDROID_APP_ID` | RevelaCode Android App ID from AdMob |
| `VITE_ADMOB_COMMUNITY_NATIVE_AD_UNIT_ID` | Community Feed Native Ad Unit ID |
| `VITE_ADMOB_COMMUNITY_OVERVIEW_NATIVE_AD_UNIT_ID` | Community Home Native Ad Unit ID |
| `VITE_ADMOB_FAITH_NATIVE_AD_UNIT_ID` | Faith Overview Native Ad Unit ID |

The build workflow passes these values into the Vite production build. They are public client identifiers, not account passwords, but keep them in Actions secrets so the build is centrally configured. Do not commit a local `.env` file.

Each Android placement uses production inventory only when **both** the production App ID and that placement's Ad Unit ID are present. Missing placement IDs use Google's test-ad mode; they do not silently reuse another hub's live unit.

## Ad behaviour and lifecycle

- **Community Feed:** one native placement per feed view. It appears after the seventh post, or at the end of a shorter non-empty feed. It is suppressed while a user is searching.
- **Community Home:** one separate native placement after the latest-post preview.
- **Faith:** one separate native placement on the Faith landing page. Scripture reading, study resources, prayer, and other focused study screens do not receive ads.
- **Elimu, Shamba operations, Biashara finance/order flows, RevelaAI conversations, and global navigation:** no AdMob placements.
- Community and Faith use separate `feedId`, `slotKey`, and Ad Unit IDs. Do not mount multiple instances of the same placement on one screen.

Native ads use `@capacitor-community/admob`'s NativeAdFeed API. The plugin labels this API **Preview**, so keep the plugin version pinned and retest native feed creation, scrolling, navigation, and ad rendering after every plugin upgrade. The current implementation uses the Small template and destroys its feed when the placement unmounts.

The native ad attribution label must remain clearly visible and at least 15px in both dimensions. The Google SDK supplies the AdChoices overlay; do not cover it or place content over the native ad. <https://support.google.com/admob/answer/6239795>

## Test mode and production readiness

You can build and install the APK with Google's official demo App ID and test ads. Test ads do not generate revenue. Never click your own live production ads.

AdMob may limit serving until the app is published and linked to a supported app store and passes its app-readiness review. Creating ad units and wiring IDs does not prove that the app is approved or that live ads are filling.

Official references:

- [Create a native ad unit](https://support.google.com/admob/answer/7187428)
- [Native ads overview and attribution requirements](https://support.google.com/admob/answer/6239795)
- [AdMob app readiness](https://support.google.com/admob/answer/10564477)
- [Google test ads for Android](https://developers.google.com/admob/android/test-ads)
- [Capacitor AdMob Native Ads guide and release notes](https://github.com/capacitor-community/admob/releases)
