# AdMob for the RevelaCode Android APK

## What this adds

The existing Community ad placement switches by platform:

- **Android APK:** one compact native AdMob sponsored placement in the Community feed.
- **Web/PWA:** retains the existing Community-only AdSense placement.
- **Other hubs:** this component is not shown outside the Community placement.
- **Browser builds:** no native SDK call is made.

Native in-feed ads use `@capacitor-community/admob`'s NativeAdFeed API, which the plugin currently marks as Preview. It is restricted to one stable slot and is destroyed when the component unmounts. Native ads can temporarily reserve feed space while loading; placement is removed if loading fails or times out.

## No Google Play developer account is needed to test

You can build and install the APK with Google's official demo App ID and native-ad unit. Those demo IDs produce **test advertisements only** and do not earn revenue.

To enable your own inventory later, create an AdMob account/app and native ad unit, then place both IDs in your local, uncommitted `.env` file:

```dotenv
VITE_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
VITE_ADMOB_COMMUNITY_NATIVE_AD_UNIT_ID=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
```

Use the App ID shown in AdMob app settings and the Native ad unit ID created for the Community placement. These are public client identifiers, not passwords. Do not commit your `.env` file.

Production identifiers are only used when **both** settings are present. If either one is missing, the APK safely switches to Google's demo App ID/unit and test mode.

## Build and sync the Android project

Run these commands from the repository root in PowerShell:

```powershell
npm install
npm run build
npm run android:sync:admob
```

Then open Android Studio and build the APK, or run:

```powershell
cd android
.\gradlew.bat assembleDebug
```

The `android/` directory can stay local/untracked. The configuration script patches the generated `AndroidManifest.xml` and `strings.xml` after Capacitor sync, so the native App ID is not dependent on committing generated Android files.

## Important AdMob account limitation

Adding an unpublished app in AdMob is useful for setup and testing, but Google says an app receives limited ad serving until it is published and linked to a supported app store and passes its app-readiness review. A Google Play developer account is therefore not required to **integrate or test** AdMob, but an APK downloaded directly from your website does not by itself complete AdMob's app-readiness review.

Official references:
- [Set up an app in AdMob](https://support.google.com/admob/answer/9989980)
- [About app readiness](https://support.google.com/admob/answer/10564477)
- [Google test ads for Android](https://developers.google.com/admob/android/test-ads)

Never click your own live production ads. Use the demo IDs while developing and testing.
