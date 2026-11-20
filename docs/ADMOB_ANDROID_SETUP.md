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

In the **RevelaCode-Android** repository, add these repository Actions variables (Settings → Secrets and variables → Actions → Variables). The build workflow reads them through `vars.*`, not `secrets.*`. These identifiers are public app/ad-unit IDs, not credentials:

| Secret name | Value |
|---|---|
| `VITE_ADMOB_ANDROID_APP_ID` | RevelaCode Android App ID from AdMob |
| `VITE_ADMOB_COMMUNITY_NATIVE_AD_UNIT_ID` | Community Feed Native Ad Unit ID |
| `VITE_ADMOB_COMMUNITY_OVERVIEW_NATIVE_AD_UNIT_ID` | Community Home Native Ad Unit ID |
| `VITE_ADMOB_FAITH_NATIVE_AD_UNIT_ID` | Faith Overview Native Ad Unit ID |

The Android build workflow passes these values into the Vite production build and the native AdMob configuration step. Keep them in repository Variables so the workflow and this setup remain consistent. Do not commit a local `.env` file.

Each Android placement uses production inventory only when **both** the production App ID and that placement's Ad Unit ID are present. A production build fails configuration if any required ID is missing or malformed; it must never silently fall back to Google's test ads or reuse another hub's live unit. Google's test IDs are permitted only in the isolated native-compile workflow, which explicitly sets `ADMOB_ALLOW_TEST_IDS=true`.

## Ad behaviour and lifecycle

- **Community Feed:** one native placement per feed view. It appears after the seventh post, or at the end of a shorter non-empty feed. It is suppressed while a user is searching.
- **Community Home:** one separate native placement after the latest-post preview.
- **Faith:** one separate native placement on the Faith landing page. Scripture reading, study resources, prayer, and other focused study screens do not receive ads.
- **Elimu, Shamba operations, Biashara finance/order flows, RevelaAI conversations, and global navigation:** no AdMob placements.
- Community and Faith use separate `feedId`, `slotKey`, and Ad Unit IDs. Do not mount multiple instances of the same placement on one screen.

Native ads use `@capacitor-community/admob`'s NativeAdFeed API. The plugin labels this API **Preview**, so keep the plugin version pinned and retest native feed creation, scrolling, navigation, and ad rendering after every plugin upgrade. The current implementation uses the Small template and destroys its feed when the placement unmounts.

The native ad attribution label must remain clearly visible and at least 15px in both dimensions. The Google SDK supplies the AdChoices overlay; do not cover it or place content over the native ad. <https://support.google.com/admob/answer/6239795>


## NEXORA Basic Creator Flow rewarded tools

Create one additional **Rewarded** ad unit under the same RevelaCode Android app:

| AdMob ad-unit name | Placement | ID environment variable |
|---|---|---|
| `NEXORA - Basic Creator Tool Credit - Rewarded` | Opt-in video in NEXORA Creator Flow for Basic subscribers | `VITE_ADMOB_NEXORA_REWARDED_AD_UNIT_ID` |

Configure its reward as amount `1` and item `nexora_basic_tool_credit`. Enable **server-side verification (SSV)** and set the callback URL to:

`https://nexora-foundry-api.onrender.com/api/v1/creator-flow/rewards/admob/ssv`

Verify and save that URL in AdMob. On the NEXORA Render API, configure:

- `NEXORA_ADMOB_REWARDED_AD_UNIT_ID` — the same full `ca-app-pub-.../...` ad unit ID.
- `NEXORA_REWARDED_ADMOB_REWARD_ITEM=nexora_basic_tool_credit`
- `NEXORA_REWARDED_ADMOB_REWARD_AMOUNT=1`

Set `VITE_ADMOB_NEXORA_REWARDED_AD_UNIT_ID` as an Actions **Variable** in the RevelaCode-Android repository. This variable is optional while the rewarded unit is not yet created; the rest of the Android build must continue to work without it. The Android workflow also packages the separate NEXORA site at `/dev_nexora` inside the app so Creator Flow can use the native Capacitor AdMob bridge.

The two Basic rewarded tools are Blender environment generation and enemies/vehicles generation. One verified SSV event grants one account-bound use credit. The local Foundry worker consumes one credit when it accepts the production job into its queue. A failed generation attempt does not automatically return the credit; another attempt requires another verified rewarded ad. Confirm that the required local worker tools are installed before spending a credit. Standard, Pro and Studio do not consume Basic ad credits. The browser never creates reward credits from a client-side callback.

AdMob test inventory is not proof of production SSV: Google test rewarded ads do not call the production SSV endpoint, so they must not credit a customer. Never click your own live ads. Ad revenue is paid to the AdMob publisher payment profile, not the Pochi merchant number used for NEXORA plan purchases.

## Test mode and production readiness

You can build and install the APK with Google's official demo App ID and test ads. Test ads do not generate revenue. Never click your own live production ads.

AdMob may limit serving until the app is published and linked to a supported app store and passes its app-readiness review. Creating ad units and wiring IDs does not prove that the app is approved or that live ads are filling.

Official references:

- [Create a native ad unit](https://support.google.com/admob/answer/7187428)
- [Native ads overview and attribution requirements](https://support.google.com/admob/answer/6239795)
- [AdMob app readiness](https://support.google.com/admob/answer/10564477)
- [Google test ads for Android](https://developers.google.com/admob/android/test-ads)
- [Capacitor AdMob Native Ads guide and release notes](https://github.com/capacitor-community/admob/releases)
