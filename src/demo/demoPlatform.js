/**
 * The guided tour and synthetic presentation dataset are shared product
 * features across web, desktop and the Capacitor Android WebView.
 *
 * DemoProvider activates request interception only while a user explicitly
 * starts the demo. Until then the application continues using live APIs.
 */
export function isDemoEnabled() {
  return true;
}
