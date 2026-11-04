import { Capacitor } from "@capacitor/core";

/**
 * Guided tours and synthetic presentation data are a web/desktop feature.
 * Android packages the same React bundle, so disable demo entry points and
 * API interception at runtime for both production and locally tested APKs.
 */
export function isDemoEnabled() {
  const androidBuild = import.meta.env?.VITE_ANDROID_APP === "true";
  const nativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  return !androidBuild && !nativeAndroid;
}
